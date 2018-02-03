/**
 * Created by Haimov on 08/06/2017.
 */
'use strict';

const mongoose = require('mongoose'),
      schema   = mongoose.Schema,

    track = new schema({
        track_id: {type:Number, index:1, required:true, unique:true},
        track_name: String,
        creator: String,
        length: Number,
        src: String,
        img_src: String,
        description: String
    },{strict: true});


let Track = mongoose.model('Track', track);

module.exports = Track;