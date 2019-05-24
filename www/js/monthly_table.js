'use strict';

const ID_VIEW  = 'monthly-table-view';
const ID_LABEL = 'monthly-table-title';

class MonthlyTable
{
     //-------------------------------------------------------------------------
     constructor(){
     }

     //-------------------------------------------------------------------------
     get id(){
          return ID_VIEW;
     }

     //-------------------------------------------------------------------------
     update(collection){
          const table = $$('monthly-table');
          table.clearAll();
          for( let day = 1 ; day <= 31 ; day++ )
          {
               const daily = collection.items[day];
               if( !daily )
               {
                    break;
               }
               let item = {
                    day:      day,
                    time:     ['', ''],
                    max:      ['', ''],
                    min:      ['', ''],
                    pulse:    ['', ''],
                    medicine: ['', '']
               };
               for( let n = 0 ; n < 2 ; n++ )
               {
                    if( daily.values[n].isValid() )
                    {
                         item.time[n]     = daily.values[n].timeStr;
                         item.max[n]      = daily.values[n].max;
                         item.min[n]      = daily.values[n].min;
                         item.pulse[n]    = daily.values[n].pulse;
                         item.medicine[n] = daily.values[n].medicine? `<span class="mdi mdi-check-bold"></span>` : ``;
                    }
               }
               let t = new Date(daily.year, daily.month, day);
               if( t.getDay() === 0 )
               {
                    item.$css = {background: '#FFF0F0'};
               }
               else if( t.getDay() === 6 )
               {
                    item.$css = {background: '#F0F0FF'};
               }
               table.add(item);
          }

          $$(ID_LABEL).define('label', `${collection.year}年 ${collection.month+1}月 の記録`);
          $$(ID_LABEL).refresh();
     }

     //-------------------------------------------------------------------------
     static getUIObject(id){
          const style = 'height:20px; line-height:20px; text-align:center; width:100%';
          const cellTemplate = function(obj){
               return `<div style="width:100%">
                    <div style="${style}">${obj[this.id][0]}</div>
                    <div style="width:100%; height:1px; background: #DDD"></div>
                    <div style="${style}">${obj[this.id][1]}</div>
               </div>`;
          };

          const table = {
               view: 'datatable',
               id: 'monthly-table',
               headerRowHeight: 20,
               rowHeight: 41,
               scroll: 'y',
               prerender: true,
               columns: [
                    {
                         header: {text: '日', rowspan: 2},
                         id: 'day',
                         width: 40,
                         css: {'text-align': 'center'},
                    },
                    {
                         header: {
                              text: '時刻',
                              rowspan: 2,
                              css: {'text-align': 'center'}
                         },
                         id: 'time',
                         fillspace: true,    //width: 50,
                         template: cellTemplate,
                         css: {'text-align': 'center'}
                    },
                    {
                         header: [
                              {
                                   text: '測定値',
                                   css: {'text-align': 'center'}, 
                                   colspan: 3
                              },
                              {
                                   text: '最高',
                                   css: {'text-align': 'center'}, 
                              }
                         ],
                         id: 'max',
                         width: 60,
                         template: cellTemplate,
                         css: {'text-align': 'center'}
                    },
                    {
                         header: [
                              '',
                              {text: '最低', css: {'text-align': 'center'}}
                         ],
                         id: 'min',
                         width: 60,
                         template: cellTemplate,
                         css: {'text-align': 'center'}
                    },
                    {
                         header: [
                              '',
                              {text: '脈拍', css: {'text-align': 'center'}}
                         ],
                         id: 'pulse',
                         width: 60,
                         template: cellTemplate,
                         css: {'text-align': 'center'}
                    },
                    {
                         header: {
                              text: '服薬',
                              rowspan: 2,
                              css: {'text-align': 'center'}
                         },
                         id: 'medicine',
                         width: 60,
                         template: cellTemplate,
                         css: {'text-align': 'center', 'color': 'green'}
                    }
               ],
               data: [
                    {
                         day: 21,
                         time: ['06:00', '21:00'],
                         max: [115, 120],
                         min: [70, 74],
                         pulse: [65, ''],
                         medicine: ['ok', '']
                    }
               ]
          };

          return {
               type: 'line',
               id: id,
               rows: [
                    {
                         view: 'label',
                         id: ID_LABEL,
                         label: '2000年 12月',
                         align: 'center',
                         height: 30,
                         css: {
                              'line-height': '30px', 
                              'background': '#888',
                              'color': 'white'
                         }
                    },
                    table,
                    {height: 40}
               ]
          };
     }
}

//------------------------------------------------------------------------------
module.exports = MonthlyTable;
