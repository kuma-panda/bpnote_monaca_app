'use strict';

window.jQuery = window.$ = require('jquery');

const Async = require('async');
const MonthlyBpDataCollection = require('./bpdata');
const EditDialog = require('./edit_dialog');
const MonthlyTable = require('./monthly_table');
const MonthlyChart = require('./monthly_chart');

const ID_TABVIEW       = 'app-tabview';
const ID_MONTHLY_TABLE = 'app-monthly-table';
const ID_MONTHLY_CHART = 'app-monthly-chart';

//------------------------------------------------------------------------------
class App
{
     //-------------------------------------------------------------------------
     constructor(){
          webix.i18n.setLocale("ja-JP");
          webix.i18n.calendar.done = '設定';
          webix.i18n.calendar.hours = '時';
          this.m_database = new PouchDB('bpnote');
          this.m_collection = new MonthlyBpDataCollection();
          this.m_dailyData = [
               {
                    id: 'time',
                    title: '　測定時刻',
                    morning: '',
                    night: ''
               },
               {
                    id: 'max',
                    title: '　最高血圧(mmHg)',
                    morning: '',
                    night: '',
               },
               {
                    id: 'min',
                    title: '　最低血圧(mmHg)',
                    morning: '',
                    night: ''
               },
               {
                    id: 'pulse',
                    title: '　脈拍(回/分)',
                    morning: '',
                    night: ''
               },
               {
                    id: 'medicine',
                    title: '　服薬チェック',
                    morning: false,
                    night: false
               }
          ];
          this.m_monthlyTable = new MonthlyTable();
          this.m_monthlyChart = new MonthlyChart();
          this.m_editDialog = new EditDialog();
     }

     //-------------------------------------------------------------------------
     //   UIを生成
     //-------------------------------------------------------------------------
     create(){
          const calendarUI = {     // カレンダー
               view: 'calendar',
               id: 'calendar',
               date: new Date(),
               calendarHeader: `%Y年 %n月`,
               monthSelect: false,
               dayTemplate: function(t){
                    return `<div class="day" style="font-size:16px">${t.getDate()}</div>`;
               },
               cellHeight: 48,
               icons: [
                    {
                         template: function(){
                              return `<span class="webix_cal_icon_today webix_cal_icon">今日</span>`;
                         },
                         on_click: {
                              "webix_cal_icon_today": function(){
                                   this.setValue(new Date());
                                   this.callEvent("onAfterDateSelect", [this.getSelectedDate()]);
                              }
                         }
                    }
               ]
          };

          const dailyTableUI = {   // カレンダーで選択した日のデータを表示するテーブル
               view: 'datatable',
               id: 'daily-table',
               scroll: false,
               autoheight: true,
               select: 'cell',
               columns: [
                    {
                         header: '5月 19日（日曜日）',
                         id: 'title',
                         fillspace: true
                    },
                    {
                         header: {
                              text: '朝',
                              css: {'text-align': 'center'},
                         },
                         css: {'text-align': 'center'},
                         id: 'morning',
                         width: 90,
                         template: function(obj){
                              if( obj.id !== 'medicine' )
                              {
                                   return obj.morning;
                              }
                              if( obj.morning )
                              {
                                   return `
                                        <div style="color:green; text-align:center">
                                             <span class="mdi mdi-check-bold"></span>
                                        </div>
                                   `;
                              }
                              else
                              {
                                   return '';
                              }
                         }
                    },
                    {
                         header: {
                              text: '夜',
                              css: {'text-align': 'center'},
                         },
                         css: {'text-align': 'center'},
                         id: 'night',
                         width: 90,
                         template: function(obj){
                              if( obj.id !== 'medicine' )
                              {
                                   return obj.night;
                              }
                              if( obj.night )
                              {
                                   return `
                                        <div style="color:green; text-align:center">
                                             <span class="mdi mdi-check-bold"></span>
                                        </div>
                                   `;
                              }
                              else
                              {
                                   return '';
                              }
                         }
                    }
               ],
               data: this.m_dailyData
          };

          webix.ui({
               view: 'tabview',
               id: ID_TABVIEW,
               animate: {type: 'slide'},
               cells: [
                    {
                         header: '毎日の記録',
                         body: {
                              type: 'line',
                              rows: [
                                   calendarUI,
                                   dailyTableUI,
                                   {}
                              ]
                         }
                    },
                    {
                         header: '月間データ',
                         body: MonthlyTable.getUIObject(ID_MONTHLY_TABLE)
                    },
                    {
                         header: 'グラフ',
                         body: MonthlyChart.getUIObject(ID_MONTHLY_CHART) 
                    }
               ]
          });

          $$(ID_TABVIEW).getTabbar().attachEvent('onChange', function(id){
               if( id === ID_MONTHLY_CHART )
               {
                    this.m_monthlyChart.update(this.m_collection);
               }
          }.bind(this));

          $$('calendar').attachEvent('onAfterMonthChange', function(t){
               // このイベントは、カレンダーのヘッダ部にある < と > のボタンで
               // 表示月を前後に移動させた時に発生する
               // このイベントが発火した直後は、日は未選択の状態であると
               // みなす（実際には選択が隠れているだけだが...）。
               this.changeMonth(t, function(){
                    t.setDate(1);
                    $$('calendar').selectDate(t);
                    this.selectDay(t);
               }.bind(this));
          }.bind(this));

          $$('calendar').attachEvent('onAfterDateSelect', function(t){
               // このイベントは、日を選択した場合に発火する
               // （表示月が変わっている可能性があるので注意）
               this.selectDay(t);
          }.bind(this));

          $$('daily-table').attachEvent('onBeforeSelect', function(selection){
               if( selection.column === 'morning' )
               {
                    this.edit(0);
               }
               else if( selection.column === 'night' )
               {
                    this.edit(1);
               }
               return false;
          }.bind(this));

          this.changeMonth(new Date(), function(){
               $$('calendar').selectDate(new Date());
               this.selectDay(new Date());
          }.bind(this));
     }

     //-------------------------------------------------------------------------
     changeMonth(date, callback){
          this.unselectDay();
          this.m_collection.setMonth(date.getFullYear(), date.getMonth());
          this.m_collection.loadFromDatabase(this.m_database, function(err){
               if( err )
               {
                    webix.alert({
                         type: 'alert-error',
                         text: err.message
                    });
               }
               else { console.log('loadFromDatabase success'); }

               this.m_monthlyTable.update(this.m_collection);

               if( callback )
               {
                    callback(err);
               }
          }.bind(this));
     }

     //-------------------------------------------------------------------------
     selectDay(t){
          Async.waterfall([
               function(next){
                    if( (t.getFullYear() === this.m_collection.year) && (t.getMonth() === this.m_collection.month) )
                    {
                         return next();
                    }
                    this.changeMonth(t, next);
               }.bind(this)
          ], function(){
               let data = this.m_collection.items[t.getDate()];
               ['morning', 'night'].forEach(function(name, index){
                    if( data.values[index].isValid() )
                    {
                         let h = ('0'+data.values[index].hour).slice(-2);
                         let m = ('0'+data.values[index].minute).slice(-2);
                         this.m_dailyData[0][name] = `${h}:${m}`;
                         this.m_dailyData[1][name] = data.values[index].max;
                         this.m_dailyData[2][name] = data.values[index].min;
                         this.m_dailyData[3][name] = data.values[index].pulse;
                         this.m_dailyData[4][name] = data.values[index].medicine;
                    }
                    else
                    {
                         this.m_dailyData[0][name] = '';
                         this.m_dailyData[1][name] = '';
                         this.m_dailyData[2][name] = '';
                         this.m_dailyData[3][name] = '';
                         this.m_dailyData[4][name] = false;
                    }
               }, this);
               const table = $$('daily-table');
               table.config.columns[0].header = webix.Date.dateToStr("%m月 %d日（%D曜日）")(t);
               table.refreshColumns();
               table.define('data', this.m_dailyData);
               table.refresh();
          }.bind(this));
     }

     //-------------------------------------------------------------------------
     unselectDay(){
          ['morning', 'night'].forEach(function(name){
               this.m_dailyData[0][name] = '';
               this.m_dailyData[1][name] = '';
               this.m_dailyData[2][name] = '';
               this.m_dailyData[3][name] = '';
               this.m_dailyData[4][name] = false;
          }, this);
          const table = $$('daily-table');
          table.config.columns[0].header = '';
          table.refreshColumns();
          table.define('data', this.m_dailyData);
          table.refresh();
     }

     //-------------------------------------------------------------------------
     edit(index){
          let day = $$('calendar').getSelectedDate().getDate();
          const data = this.m_collection.items[day].values[index];
          const title = `${$$('daily-table').config.columns[0].header[0].text} ${['朝','夜'][index]}のデータ`; 

          let tasks = [
               function(next){
                    this.m_editDialog.title = title;
                    this.m_editDialog.show(data, function(newData){
                         if( newData )
                         {
                              newData.assignTo(data);
                              this.selectDay($$('calendar').getSelectedDate());
                              return next(null, true);
                         }
                         next(null, false);
                    }.bind(this));
               }.bind(this),
               function(result, next){
                    if( !result )
                    {
                         return next();
                    }
                    this.m_collection.items[day].saveToDatabase(this.m_database, function(err){
                         next(err);
                    });
               }.bind(this)
          ];

          Async.waterfall(tasks, function(err){
               if( err )
               {
                    webix.alert({
                         type: 'alert-error',
                         text: err.message
                    });
               }
               this.m_monthlyTable.update(this.m_collection);
          }.bind(this));
     }
}

//------------------------------------------------------------------------------
webix.ready(function(){
     const app = new App();
     app.create();
});
