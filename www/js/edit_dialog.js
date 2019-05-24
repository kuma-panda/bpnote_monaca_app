'use strict';

const EventEmitter = require('events').EventEmitter;

const ID_DIALOG = 'edit-dialog';
const ID_HEADER = 'edit-dialog-header';
const ID_FORM   = 'edit-dialog-form';

//------------------------------------------------------------------------------
class EditDialog
{
     //-------------------------------------------------------------------------
     constructor(){
          this.m_data = null;
          this.m_title = '';
          this.m_event = new EventEmitter();
          this.create();
     }

     //-------------------------------------------------------------------------
     get title(){
          return this.m_title;
     }
     set title(title){
          this.m_title = title;
     }

     //-------------------------------------------------------------------------
     create(){
          const form = {
               view: 'form',
               id: ID_FORM,
               elements: [
                    {
                         view: 'datepicker',
                         label:'測定時刻', 
                         type: 'time',
                         name: 'time'
                    },
                    {
                         view: 'text',
                         name: 'max',
                         type: 'number',
                         label: '最高血圧',
                    },
                    {
                         view: 'text',
                         name: 'min',
                         type: 'number',
                         label: '最低血圧',
                    },
                    {
                         view: 'text',
                         name: 'pulse',
                         type: 'number',
                         label: '脈拍',
                    },
                    {
                         view: 'switch',
                         name: 'medicine',
                         label: '服薬',
                    },
               ],
               elementsConfig: {
                    labelWidth: 70
               }
          };

          const body = {
               type: 'clean',
               borderless: true,
               rows: [
                    {
                         type: 'header',
                         id: ID_HEADER,
                         height: 30,
                         template: '<span id="dialog-header">XX月 XX日（日曜日）　朝のデータ</span>',
                         css: {background:'#888', color:'white', 'text-align': 'center'}
                    },
                    form,
                    {
                         cols: [
                              {width: 10},
                              {
                                   view: 'button',
                                   label: '保存する',
                                   css: 'webix_primary',
                                   width: 240,
                                   click: function(){
                                        let v = $$(ID_FORM).getValues();
                                        this.m_data.hour = v.time.getHours(),
                                        this.m_data.minute = v.time.getMinutes();
                                        this.m_data.max = v.max;
                                        this.m_data.min = v.min;
                                        this.m_data.pulse = v.pulse;
                                        this.m_data.medicine = v.medicine;
                                        this.m_event.emit('close', this.m_data);
                                        this.m_dialog.hide();
                                   }.bind(this)
                              },
                              {width: 10}
                         ]
                    },
                    {height:4}
               ]
          }

          // view:'popup' にし、modal:false(デフォルト) にすると、
          // ウィンドゥ外の領域のクリックで自動的に消える
          this.m_dialog = webix.ui({
               view:      'popup',
               id:        ID_DIALOG,
               position:  'top',
               body:      body
          });
          this.m_dialog.attachEvent('onShow', function(){
               $('#dialog-header').text(this.m_title);
          }.bind(this));
     }

     //-------------------------------------------------------------------------
     show(data, callback){
          this.m_data = data.clone();   // this.m_data は BpData オブジェクト
          $$(ID_FORM).setValues({
               time: new Date(2019, 0, 1, this.m_data.hour, this.m_data.minute),
               max: this.m_data.max,
               min: this.m_data.min,
               pulse: this.m_data.pulse,
               medicine: this.m_data.medicine
          });
          this.m_event.removeAllListeners('save');
          this.m_event.once('close', callback);
          this.m_dialog.detachEvent('onHide');
          this.m_dialog.attachEvent('onHide', function(){
               this.m_event.emit('close');
          }.bind(this));
          this.m_dialog.show();
     }
}

//------------------------------------------------------------------------------
module.exports = EditDialog;