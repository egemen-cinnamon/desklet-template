'use strict';

const Desklet  = imports.ui.desklet;
const Settings = imports.ui.settings;
const St       = imports.gi.St;
const GLib     = imports.gi.GLib;
const Mainloop = imports.mainloop;

/* ------------------------------------------------------------------ */
/* Settings keys — add your own keys to settings-schema.json too      */
/* ------------------------------------------------------------------ */

const CFG_KEYS = [
    'language', 'compact',
    'width', 'height', 'fontSize', 'uiScale',
    'bgColor', 'textColor', 'accentColor', 'borderColor',
    'opacity', 'borderWidth', 'borderRadius',
    'deskletTitle',
];

/* ------------------------------------------------------------------ */
/* Main desklet                                                        */
/* ------------------------------------------------------------------ */

function MyDesklet(metadata, desklet_id) {
    this._init(metadata, desklet_id);
}

MyDesklet.prototype = {
    __proto__: Desklet.Desklet.prototype,

    _init: function (metadata, desklet_id) {
        Desklet.Desklet.prototype._init.call(this, metadata, desklet_id);
        this.instanceId  = desklet_id;
        this._cfgIdle    = null;
        this._renderIdle = null;
        try {
            this._setup(metadata, desklet_id);
        } catch (e) {
            global.logError('[desklet] startup error: ' + e + '\n' + (e && e.stack ? e.stack : ''));
            try {
                this.setContent(new St.Label({
                    text: 'Desklet failed to start:\n' + e,
                    style: 'color:#ff7b72; padding:8px; background-color:rgba(0,0,0,0.6);'
                }));
            } catch (e2) { /* ignore */ }
        }
    },

    _setup: function (metadata, desklet_id) {
        this.settings = new Settings.DeskletSettings(this, metadata.uuid, desklet_id);
        CFG_KEYS.forEach(function (k) {
            this.settings.bindProperty(Settings.BindingDirection.IN, k, 'cfg_' + k, this._onCfgChanged.bind(this));
        }, this);

        this._buildUi();
        this._applyTheme();
        this._render();
    },

    /* ---- UI skeleton ---- */

    _buildUi: function () {
        this._root = new St.BoxLayout({ vertical: true });
        this.setContent(this._root);
    },

    _applyTheme: function () {
        const w  = Math.max(60,  +(this.cfg_width)        || 200);
        const h  = Math.max(40,  +(this.cfg_height)       || 120);
        const fs = Math.max(8,   +(this.cfg_fontSize)     || 13);
        const op = Math.min(1, Math.max(0, +(this.cfg_opacity)      || 1));
        const bw = Math.max(0,   +(this.cfg_borderWidth)  || 0);
        const br = Math.max(0,   +(this.cfg_borderRadius) || 8);
        const bg = this.cfg_bgColor     || 'rgba(30,30,30,0.85)';
        const fg = this.cfg_textColor   || '#ffffff';
        const bc = this.cfg_borderColor || 'rgba(255,255,255,0.15)';

        this._root.style =
            'width:'            + w  + 'px;' +
            'min-height:'       + h  + 'px;' +
            'font-size:'        + fs + 'px;' +
            'color:'            + fg + ';' +
            'background-color:' + bg + ';' +
            'border:'           + bw + 'px solid ' + bc + ';' +
            'border-radius:'    + br + 'px;' +
            'opacity:'          + op + ';' +
            'padding:12px;';
    },

    /* ---- render: put your content here ---- */

    _render: function () {
        this._root.get_children().forEach(function (c) {
            this._root.remove_actor(c);
        }, this);

        const title = this.cfg_deskletTitle || '';
        if (title) {
            const lbl = new St.Label({ text: title });
            lbl.style = 'font-weight:bold; margin-bottom:6px;';
            this._root.add_actor(lbl);
        }

        // TODO: add your widgets here
        this._root.add_actor(new St.Label({ text: 'Hello, Cinnamon!' }));
    },

    _queueRender: function () {
        if (this._renderIdle) return;
        this._renderIdle = Mainloop.idle_add(function () {
            this._renderIdle = null;
            this._render();
            return false;
        }.bind(this));
    },

    /* ---- settings change ---- */

    _onCfgChanged: function () {
        if (this._cfgIdle) return;
        this._cfgIdle = Mainloop.idle_add(function () {
            this._cfgIdle = null;
            this._applyTheme();
            this._render();
            return false;
        }.bind(this));
    },

    /* ---- lifecycle ---- */

    on_desklet_removed: function () {
        if (this._cfgIdle)    { Mainloop.source_remove(this._cfgIdle);    this._cfgIdle    = null; }
        if (this._renderIdle) { Mainloop.source_remove(this._renderIdle); this._renderIdle = null; }
        try { this.settings.finalize(); } catch (e) { /* ignore */ }
    }
};

function main(metadata, desklet_id) {
    return new MyDesklet(metadata, desklet_id);
}
