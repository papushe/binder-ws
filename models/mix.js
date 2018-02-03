'use strict';
const mongoose = require('mongoose'),
      schema   = mongoose.Schema,
        mix = new schema({
        mix_name: {type:String, index:1, required:true, unique:true},
        creator: String,
        creation_date: String,
        img_src: String,
        length: Number,
        tracks_id:[Number]
    },{strict: true});

let Mix = mongoose.model('Mix', mix);

module.exports = Mix;