'use strict';

const ID_LABEL = 'monthly-chart-label';

class MonthlyChart
{
     //-------------------------------------------------------------------------
     constructor(){
          this.m_chart = null;
     }

     //-------------------------------------------------------------------------
     update(collection){
          let plotData = {
               min: [],
               max: []
          };

          let lastDay = collection.items.length - 1;   // [0] は常に undefined の要素を持つ
          for( let day = lastDay ; day >= 1 ; --day )
          {
               const daily = collection.items[day];
               // 夜・朝の順に配列にプッシュしていることに注意
               // Ｙデータ（日）は、例えばlastDay が 31 で、
               // 「晦日」の場合、
               //   夜は (lastDay+1) - 31 - 0.5 = 0.5
               //   朝は (lastDay+1) - 31       = 1
               // 「朔日」の場合
               //   夜は (lastDay+1) - 1 - 0.5  = 30.5
               //   朝は (lastDay+1) - 1        = 31
               // としてプロットする。Ｙ軸のレンジは 0～(lastDay+1)。 

               //////// テスト用 //////////
               // plotData.max.push({
               //      x: Math.floor(110+Math.random()*30),
               //      y: (lastDay+1) - day - 0.5
               // });
               // plotData.min.push({
               //      x: Math.floor(60+Math.random()*20),
               //      y: (lastDay+1) - day - 0.5
               // });
               // plotData.max.push({
               //      x: Math.floor(110+Math.random()*30),
               //      y: (lastDay+1) - day
               // });
               // plotData.min.push({
               //      x: Math.floor(60+Math.random()*20),
               //      y: (lastDay+1) - day
               // });
               //////// ここまで //////////

               if( daily.values[1].isValid() )    // 夜
               {
                    plotData.min.push({
                         x: daily.values[1].min || NaN,
                         y: (lastDay+1) - day - 0.5
                    });
                    plotData.max.push({
                         x: daily.values[1].max || NaN,
                         y: (lastDay+1) - day - 0.5
                    });
               }
               else
               {
                    plotData.min.push({
                         x: NaN,
                         y: (lastDay+1) - day - 0.5
                    });
                    plotData.max.push({
                         x: NaN,
                         y: (lastDay+1) - day - 0.5
                    });
               }

               if( daily.values[0].isValid() )    // 朝
               {
                    plotData.min.push({
                         x: daily.values[0].min || NaN,
                         y: (lastDay+1) - day
                    });
                    plotData.max.push({
                         x: daily.values[0].max || NaN,
                         y: (lastDay+1) - day
                    });
               }
               else
               {
                    plotData.min.push({
                         x: NaN,
                         y: (lastDay+1) - day
                    });
                    plotData.max.push({
                         x: NaN,
                         y: (lastDay+1) - day
                    });
               }
          }

          this.internalCreateChart(lastDay, plotData);

          $$(ID_LABEL).define('label', `${collection.year}年 ${collection.month+1}月 の記録`);
          $$(ID_LABEL).refresh();
     }
     
     //-------------------------------------------------------------------------
     internalCreateChart(lastDay, plotData){
          if( this.m_chart )
          {
               this.m_chart.destroy();
               this.m_chart = null;
          }
          const $container = $('#chart-container');
          $container.empty();
          const $canvas = $('<canvas>').appendTo($container);
          this.m_chart = new Chart($canvas, {
               type: 'line',
               options: {
                    responsive: true,
                    layout: {
                         padding: {
                              left: 5,
                              top: 10,
                              right: 5,
                              bottom: 0
                         }
                    },
                    maintainAspectRatio: false,
                    tooltips: {
                         enabled: false
                    },
                    hover: {
                         mode: null
                    },
                    legend: {
                         display: false
                    },
                    animation: {
                         duration: 0
                    },
                    hover: {
                         animationDuration: 0
                    },
                    responsiveAnimationDuration: 0,
                    scales: {
                         xAxes: [
                              {    // X軸は測定値。軸はグラフの上に配置
                                   position: 'top',
                                   type: 'linear',
                                   ticks: {
                                        min: 40,
                                        max: 200,
                                        stepSize: 20
                                   }
                              }
                         ],
                         yAxes: [
                              {    // Y軸は「日」。
                                   // ただし、画面の上を朔日(月初)、下を晦日(月末)として表示するため
                                   // プロットする際のデータは実際の「日」とは異なることに注意
                                   // また、朝データと夜データはＹ座標を0.5ずらしてプロットする
                                   // （例えば、５月１日夜のデータのＹ座標は 30.5 を指定する必要がある）
                                   position: 'left',
                                   type: 'linear',
                                   ticks: {
                                        min: 0,
                                        max: lastDay + 1,
                                        stepSize: 1,
                                        callback: function(value){
                                             let day = lastDay + 1 - parseInt(value, 10);
                                             if( day > 0 && !(day % 5) ){ return day; }
                                             else { return ''; }
                                        }
                                   }
                              }
                         ]
                    }
               },
               data: {
                    datasets: [{
                         data: plotData.min,
                         fill: false,
                         spanGaps: false,
                         lineTension: 0,
                         borderColor: 'rgb(0,0,255)',
                         borderJoinStyle: 'round',
                         borderWidth: 1,
                         pointBorderWidth: 0,
                         pointBackgroundColor: 'rgb(0,0,255)',
                         pointRadius: 2
                    }, {
                         data: plotData.max,
                         fill: false,
                         spanGaps: false,
                         lineTension: 0,
                         borderColor: 'rgb(255,0,0)',
                         borderJoinStyle: 'round',
                         borderWidth: 1,
                         pointBorderWidth: 0,
                         pointBackgroundColor: 'rgb(255,0,0)',
                         pointRadius: 2
                    }]
               }
          });
     }

     //-------------------------------------------------------------------------
     static getUIObject(id){
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
                    {
                         type: 'clean',
                         template: `
                              <div id="chart-container" style="width:100%; height:100%">
                              </div>
                         `
                    },
                    {height: 40}
               ]
          };
     }
}

//------------------------------------------------------------------------------
module.exports = MonthlyChart;
