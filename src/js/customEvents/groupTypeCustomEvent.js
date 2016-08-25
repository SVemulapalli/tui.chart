/**
 * @fileoverview GroupTypeCustomEvent is event handle layer for grouped tooltip option.
 * @author NHN Ent.
 *         FE Development Lab <dl_javascript@nhnent.com>
 */

'use strict';

var CustomEventBase = require('./customEventBase');
var zoomMixer = require('./zoomMixer');

var GroupTypeCustomEvent = tui.util.defineClass(CustomEventBase, /** @lends GroupTypeCustomEvent.prototype */ {
    /**
     * GroupTypeCustomEvent is event handle layer for grouped tooltip option.
     * @param {object} params parameters
     * @constructs GroupTypeCustomEvent
     * @extends CustomEventBase
     */
    init: function(params) {
        CustomEventBase.call(this, params);

        /**
         * previous index of group data
         * @type {null}
         */
        this.prevIndex = null;

        /**
         * whether zoomable or not
         * @type {boolean}
         */
        this.zoomable = params.zoomable;

        /**
         * type of size
         * @type {string}
         */
        this.sizeType = this.isVertical ? 'height' : 'width';

        if (this.zoomable) {
            tui.util.extend(this, zoomMixer);
            this._initForZoom(params.zoomable);
        }
    },

    /**
     * Initialize data of custom event
     * @param {Array.<object>} seriesInfos series infos
     * @override
     */
    initCustomEventData: function(seriesInfos) {
        CustomEventBase.prototype.initCustomEventData.call(this, seriesInfos);

        if (this.zoomable) {
            this._showTooltipAfterZoom();
        }
    },

    /**
     * Find data by client position.
     * @param {number} clientX - clientX
     * @param {number} clientY - clientY
     * @returns {object}
     * @private
     */
    _findGroupData: function(clientX, clientY) {
        var layerPosition = this._calculateLayerPosition(clientX, clientY, true);
        var pointValue;

        if (this.isVertical) {
            pointValue = layerPosition.x;
        } else {
            pointValue = layerPosition.y;
        }

        return {
            indexes: {
                groupIndex: this.tickBaseCoordinateModel.findIndex(pointValue)
            }
        };
    },

    /**
     * Get first data.
     * @returns {{indexes: {groupIndex: number}}} - data
     * @private
     */
    _getFirstData: function() {
        return {
            indexes: {
                groupIndex: 0
            }
        };
    },

    /**
     * Get last data
     * @returns {{indexes: {groupIndex: number}}} - data
     * @private
     */
    _getLastData: function() {
        return {
            indexes: {
                groupIndex: this.tickBaseCoordinateModel.getLastIndex()
            }
        };
    },

    /**
     * Whether out position or not.
     * @param {number} layerX layerX
     * @param {number} layerY layerY
     * @returns {boolean} result boolean
     * @private
     */
    _isOutPosition: function(layerX, layerY) {
        var dimension = this.dimension;

        return layerX < 0 || layerX > dimension.width || layerY < 0 || layerY > dimension.height;
    },

    /**
     * Show tooltip.
     * @param {{indexes: {groupIndex: number}}} foundData - data
     * @param {boolean} [isMoving] - whether moving or not
     * @private
     */
    _showTooltip: function(foundData, isMoving) {
        var index = foundData.indexes.groupIndex;

        this.prevIndex = index;
        this.fire('showGroupTooltip', {
            index: index,
            range: this.tickBaseCoordinateModel.makeRange(index),
            size: this.dimension[this.sizeType],
            isVertical: this.isVertical,
            isMoving: isMoving
        });
    },

    /**
     * Hide tooltip
     * @private
     */
    _hideTooltip: function() {
        this.fire('hideGroupTooltip', this.prevIndex);
        this.prevIndex = null;
    },

    /**
     * On mousemove.
     * @param {MouseEvent} e mouse event object
     * @private
     * @override
     */
    _onMousemove: function(e) {
        var foundData, index;

        CustomEventBase.prototype._onMousemove.call(this, e);

        if (this.zoomable && this._isAfterDragMouseup()) {
            return;
        }

        foundData = this._findGroupData(e.clientX, e.clientY);

        index = foundData.indexes.groupIndex;

        if (index === -1) {
            this._onMouseout(e);
        } else if (this.prevIndex !== index) {
            this._showTooltip(foundData);
        }
    },

    /**
     * On mouseout.
     * @override
     */
    _onMouseout: function(e) {
        var layerPosition;

        layerPosition = this._calculateLayerPosition(e.clientX, e.clientY, false);

        if (this._isOutPosition(layerPosition.x, layerPosition.y) && !tui.util.isNull(this.prevIndex)) {
            this._hideTooltip();
        }

        CustomEventBase.prototype._onMouseout.call(this);
    }
});

module.exports = GroupTypeCustomEvent;
