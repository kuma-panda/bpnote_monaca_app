'use strict';

const Async = require('async');

//------------------------------------------------------------------------------
class BpData
{
     //-------------------------------------------------------------------------
     constructor(){
          this.m_hour = 0;
          this.m_minute = 0;
          this.m_max = null;
          this.m_min = null;
          this.m_pulse = null;
          this.m_medicine = false;
     }

     //-------------------------------------------------------------------------
     clone(){
          let obj = new BpData();
          obj.loadFromJSON(this.toJSON());
          return obj;
     }

     //-------------------------------------------------------------------------
     assignTo(target){
          target.loadFromJSON(this.toJSON());
     }

     //-------------------------------------------------------------------------
     get hour(){
          return this.m_hour;
     }
     set hour(h){
          h = parseInt(h, 10);
          if( !isNaN(h) && 0 <= h && h < 24 )
          {
               this.m_hour = h;
          }
     }
     get minute(){
          return this.m_minute;
     }
     set minute(m){
          m = parseInt(m, 10);
          if( !isNaN(m) && 0 <= m && m < 60 )
          {
               this.m_minute = m;
          }
     }
     get timeStr(){
          return `${('0'+this.m_hour).slice(-2)}:${('0'+this.m_minute).slice(-2)}`;
     }
     get max(){
          return this.m_max || '';
     }
     set max(v){
          this.m_max = parseInt(v, 10) || null;
     }
     get min(){
          return this.m_min || '';
     }
     set min(v){
          this.m_min = parseInt(v, 10) || null;
     }
     get pulse(){
          return this.m_pulse || '';
     }
     set pulse(v){
          this.m_pulse = parseInt(v, 10) || null;
     }
     get medicine(){
          return this.m_medicine;
     }
     set medicine(b){
          this.m_medicine = b? true : false;
     }

     //-------------------------------------------------------------------------
     isValid(){
          return (this.m_max || this.m_min) && this.m_pulse; 
     }

     //-------------------------------------------------------------------------
     loadFromJSON(json){
          this.hour = json.hour;
          this.minute = json.minute;
          this.max = json.maxBp;
          this.min = json.minBp;
          this.pulse = json.pulse;
          this.medicine = json.medicine;
          // console.log([this.hour, this.minute, this.max, this.min, this.pulse, this.medicine].join(', '));
     }

     //-------------------------------------------------------------------------
     toJSON(){
          return {
               hour: this.m_hour,
               minute: this.m_minute,
               maxBp: this.m_max,
               minBp: this.m_min,
               pulse: this.m_pulse,
               medicine: this.m_medicine
          };
     }
}

//------------------------------------------------------------------------------
class DailyBpData
{
     //-------------------------------------------------------------------------
     constructor(t){
          this.m_date = t || new Date();
          this.m_values = [
               new BpData(),  // 朝
               new BpData()   // 夜
          ];
     
          this.m_values[0].hour = 6;
          this.m_values[1].hour = 21;
     }

     //-------------------------------------------------------------------------
     get docID(){
          let y = this.year;
          let m = ('0'+(this.month+1)).slice(-2);
          let d = ('0'+this.day).slice(-2);
          return y + m + d;
     }
     set docID(id){
          let r = id.toString().match(/(\d{4})(\d{2})(\d{2})/);
          if( r )
          {
               this.m_date = new Date(
                    parseInt(r[1], 10),
                    parseInt(r[2], 10) - 1,
                    parseInt(r[3], 10)
               );
          }
     }
     get year(){
          return this.m_date.getFullYear();
     }
     get month(){
          return this.m_date.getMonth();
     }
     get day(){
          return this.m_date.getDate();
     }
     get values(){
          return this.m_values;
     }

     //-------------------------------------------------------------------------
     loadFromJSON(json){
          this.docID = json._id;
          this.m_values[0].loadFromJSON(json.morning || {});
          this.m_values[1].loadFromJSON(json.night || {});
     }

     //-------------------------------------------------------------------------
     toJSON(){
          let json = {
               _id: this.docID
          }
          if( this.m_values[0].isValid() )
          {
               json.morning = this.m_values[0].toJSON();
          }
          if( this.m_values[1].isValid() )
          {
               json.night = this.m_values[1].toJSON();
          }
          return json;
     }

     //-------------------------------------------------------------------------
     saveToDatabase(database, callback){
          if( !this.m_values[0].isValid() && !this.m_values[1].isValid() )
          {
               return callback();
          }
          let tasks = [
               function(next){
                    database.get(this.docID, function(err, result){
                         if( err || !result )
                         {
                              return next(null, null);
                         }
                         next(null, result._rev);
                    });
               }.bind(this),
               function(revision, next){
                    let json = this.toJSON();
                    if( revision )
                    {
                         json._rev = revision;
                    }
                    database.put(json, function(err){
                         next(err);
                    });
               }.bind(this)
          ];

          Async.waterfall(tasks, function(err){
               if( !err )
               {
                    console.log(`saved (${this.docID})`);
               }
               callback(err);
          }.bind(this));
     }
}

//------------------------------------------------------------------------------
class MonthlyBpDataCollection
{
     //-------------------------------------------------------------------------
     constructor(){
          this.m_year = (new Date()).getFullYear();
          this.m_month = (new Date()).getMonth();
          this.m_items = [];
          this.setMonth(this.m_year, this.m_month);
     }

     //-------------------------------------------------------------------------
     get year(){
          return this.m_year;
     }
     get month(){
          return this.m_month;
     }
     get items(){
          return this.m_items;
     }

     //-------------------------------------------------------------------------
     setMonth(year, month){
          this.m_year = year;
          this.m_month = month;
          let days = new Date(year, month+1, 0).getDate();
          this.m_items = [];
          for( let d = 1 ; d <= days ; d++ )
          {
               this.m_items[d] = new DailyBpData(new Date(year, month, d));
          }
     }

     //-------------------------------------------------------------------------
     loadFromDatabase(database, callback){
          const options = {
               include_docs: true,
               startkey: `${this.m_year}${('0'+(this.m_month+1)).slice(-2)}01`,
               endkey:   `${this.m_year}${('0'+(this.m_month+1)).slice(-2)}31`,
          };
          database.allDocs(options, function(err, result){
               if( err )
               {
                    return callback(err);
               }
               result.rows.forEach(function(row){
                    let doc = new DailyBpData();
                    doc.loadFromJSON(row.doc);
                    this.m_items[doc.day] = doc;
               }, this);
               callback();
          }.bind(this));
     }

     //-------------------------------------------------------------------------
     saveToDatabase(database, callback){
          Async.eachSeries(this.m_items,
               function(item, next){
                    if( !item )
                    {
                         return next();
                    }
                    item.saveToDatabase(database, next);
               },
               callback
          );
     }
}

//------------------------------------------------------------------------------
module.exports = MonthlyBpDataCollection;
