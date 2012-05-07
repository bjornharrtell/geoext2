Ext.define('GeoExt.legend.Layer', {
    extend : 'Ext.container.Container',
    alias : 'widget.gx_layerlegend',
    alternateClassName : 'GeoExt.LayerLegend',
    
    statics : {
        /**
         * Gets an array of legend xtypes that support the provided layer record,
         * with optionally provided preferred types listed first.
         * @param {GeoExt.data.LayerRecord} layerRecord A layer record to get
         * legend types for. If not provided, all registered types will be
         * returned.
         * @param {Array} preferredTypes Types that should be considered.
         * first. If not provided, all registered legend types will be returned
         * in the order of their score for support of the provided layerRecord.
         * @return {Array} xtypes of legend types that can be used with
         * the provided layerRecord.
         */
        getTypes: function(layerRecord, preferredTypes) {
            var types = (preferredTypes || []).concat();
            var goodTypes = [];
            for(var type in GeoExt.legend.Layer.types) {
                if(GeoExt.legend.Layer.types[type].supports(layerRecord)) {
                    // add to goodTypes if not preferred
                    types.indexOf(type) == -1 && goodTypes.push(type);
                } else {
                    // preferred, but not supported
                    Ext.Array.remove(types, type);
                }
            }
            // take the remaining preferred types, and add other good types 
            return types.concat(goodTypes);
        },
        /**
         * Checks whether this legend type supports the provided layerRecord.
         * @param {GeoExt.data.LayerRecord} layerRecord The layer record
         * to check support for.
         * @return {Integer} score indicating how good the legend supports the
         * provided record. 0 means not supported.
         */
        supports: function(layerRecord) {
            // to be implemented by subclasses
        },
        /** @cfg {Array}
         * An object containing a name-class mapping of LayerLegend subclasses.
         * To register as LayerLegend, a subclass should add itself to this object:
         *  
         * GeoExt.GetLegendGraphicLegend = Ext.extend(GeoExt.LayerLegend, {
         * });
         *      
         * GeoExt.LayerLegend.types["getlegendgraphic"] =
         *     GeoExt.GetLegendGraphicLegend;
         */
        types: []
    },

    config: {
        /** @cfg {GeoExt.data.LayerRecord}
         * The layer record for the legend
         */
        layerRecord: null,

        /** @cfg {Boolean}
         * Whether or not to show the title of a layer. This can be overridden
         * on the LayerStore record using the hideTitle property.
         */
        showTitle: true,

        /** @cfg {String}
         * Optional title to be displayed instead of the layer title.  If this is
         * set, the value of ``showTitle`` will be ignored (assumed to be true).
         */
        legendTitle: null,

        /** @cfg {String}
         * Optional css class to use for the layer title labels.
         */
        labelCls: null
    },

    /** @cfg layerStore {GeoExt.data.LayerStore}
     * @private
     */
    layerStore: null,
    
    initComponent: function(){
        var me = this;
        me.callParent(arguments);
        me.autoEl = {};
        me.add({
            xtype: "label",
            text: this.getLayerTitle(this.layerRecord),
            cls: 'x-form-item x-form-item-label' +
            (this.labelCls ? ' ' + this.labelCls : '')
        });
        if (me.layerRecord && me.layerRecord.store) {
            me.layerStore = me.layerRecord.store;
            me.layerStore.on("update", me.onStoreUpdate, me);
        }
    },
    
    /**
     * Update a the legend. Gets called when the store fires the update event.
     * This usually means the visibility of the layer, its style or title
     * has changed.
     * @private
     * @param {Ext.data.Store} store The store in which the record was
     * changed.
     * @param {Ext.data.Record} record The record object corresponding
     * to the updated layer.
     * @param {String} operation The type of operation.
     */
    onStoreUpdate: function(store, record, operation) {
        // if we don't have items, we are already awaiting garbage
        // collection after being removed by LegendPanel::removeLegend, and
        // updating will cause errors
        if (record === this.layerRecord && this.items.getCount() > 0) {
            var layer = record.getLayer();
            this.setVisible(layer.getVisibility() &&
                layer.calculateInRange() && layer.displayInLayerSwitcher &&
                !record.get('hideInLegend'));
            this.update();
        }
    },

    /** 
     * Updates the legend.
     * @private
     */
    update: function() {
        var title = this.getLayerTitle(this.layerRecord);
        var item = this.items.get(0);
        if (item instanceof Ext.form.Label && item.text !== title) {
            // we need to update the title
            item.setText(title);
        }
    },
    
    /** 
     * Get a title for the layer.  If the record doesn't have a title, use the 
     * name.
     * @private
     * @param {GeoExt.data.LayerRecord} record
     */
    getLayerTitle: function(record) {
        var title = this.legendTitle || "";
        if (this.showTitle && !title) {
            if (record && !record.get("hideTitle")) {
                title = record.get("title") || 
                record.get("name") || 
                record.getLayer().name || "";
            }
        }
        return title;
    },
    
    beforeDestroy: function() {
        this.layerStore &&
        this.layerStore.un("update", this.onStoreUpdate, this);
        this.callParent(arguments);
    },

    onDestroy: function() {
        this.layerRecord = null;
        this.layerStore = null;
        this.callParent(arguments);
    }

});
