/*globals Engine, GUISize */

var Charts = (function(){

  "use strict";

  const DOTS = 110, HEIGHT = 470, TOP = 75, LEFT = 46, DEBUG = 1, VERSION = "0.1.1";

  var curMetric = 1, minutes, $ = Engine.GetGUIObjectByName, 
      metrics = {
        'units':      {points:{}, max: 0, min: 1e10}, 
        'buildings':  {points:{}, max: 0, min: 1e10}, 
        'area':       {points:{}, max: 0, min: 1e10}, 
        'food':       {points:{}, max: 0, min: 1e10}, 
        'wood':       {points:{}, max: 0, min: 1e10}, 
        'stone':      {points:{}, max: 0, min: 1e10}, 
        'metal':      {points:{}, max: 0, min: 1e10},
      },
      players = {
        '0': { 'colour': { 'r': 255, 'g': 255, 'b': 255 }, visible: false }, // gaia
        '1': { 'colour': { 'r':  46, 'g':  46, 'b': 200 }, visible: false }, // blue
        '2': { 'colour': { 'r': 150, 'g':  20, 'b':  20 }, visible: false }, // red
        '3': { 'colour': { 'r':  50, 'g': 165, 'b':   5 }, visible: false }, // green
        '4': { 'colour': { 'r': 230, 'g': 230, 'b':  75 }, visible: false }, // yellow
        '5': { 'colour': { 'r':  50, 'g': 170, 'b': 170 }, visible: false }, // turquois
        '6': { 'colour': { 'r': 160, 'g':  80, 'b': 200 }, visible: false }, // pink
        '7': { 'colour': { 'r': 235, 'g': 120, 'b':  20 }, visible: false }, // orange
        '8': { 'colour': { 'r':  64, 'g':  64, 'b':  64 }, visible: false }, // gray
      };

  function deb   (){if (DEBUG > 0){print(fmt.apply(null, arguments));}}
  function tab   (s,l){l=l||8;s=new Array(l+1).join(" ")+s;return s.substr(s.length-l);}
  function each  (o,fn){Object.keys(o).forEach(a => fn(a, o[a]));}
  function scale (x,xMin,xMax,min,max){return (max-min)*(x-xMin)/(xMax-xMin)+min;}
  function fmt   (){var a=Array.prototype.slice.apply(arguments),s=a[0].split("%s"),p=a.slice(1).concat([""]),c=0;return s.map(function(t){return t + p[c++];}).join('');}
  function menuCapName (m){return "chartMenuCaption" + m[0].toUpperCase() + m.slice(1);}    
  function interpolate (data, points){

    // http://www.hevi.info/2012/03/interpolating-and-array-to-fit-another-size/
    
    var newData = [],
        factor  = (data.length - 1) / (points -1),
        i, tmp, point;

    function linear(p1, p2, px) {return p1 + (p2 - p1) * px;}

    newData[0] = data[0];
    newData[points -1] = data[data.length -1];

    for (i=1; i<points -1; i++){
      tmp = i * factor;
      point = ~~tmp;
      newData[i] = linear(data[point], data[point +1], tmp - point);
    }

    return newData;

  }

  function init(dataGame){

    var p, d, data, chartData, btn,
        maxAll, maxData, minAll, minData, 
        maxPlayers = dataGame.playerStates.length;
        
    minutes  = Object.keys(dataGame.playerStates[1].chartData).length;

    deb("init: players: %s, stamps: %s\n", maxPlayers -1, minutes);

    // toggle all players dots off
    [1,2,3,4,5,6,7,8].forEach(p => {
      btn = $("chartPlayer" + p);
      if (btn){btn.hidden = false;}
    });

    // resample data to available amount of DOTS
    for (p=1; p<maxPlayers; p++){
      players[p].visible = true;
      each(metrics, function(m, metricData){
        chartData = dataGame.playerStates[p].chartData;
        data = Object.keys(chartData).map(stamp => chartData[stamp][m]);
        // deb("init: p: %s, m: %s, data: %s\n", p, m, data);
        metricData.points[p] = {};
        data = interpolate(data, DOTS);
        // deb("init: p: %s, m: %s, data: %s\n", p, m, data);
        metricData.points[p][m] = data;
      });
    }

    // determine max/min
    each(metrics, function(m, metricData){
      maxAll = 0; minAll = 1e10;
      for (p=1; p<maxPlayers; p++){
        minData = Math.min.apply(Math, metricData.points[p][m]);
        minAll = minData < minAll ? minData : minAll;
        maxData = Math.max.apply(Math, metricData.points[p][m]);
        maxAll = maxData > maxAll ? maxData : maxAll;
      }
      metricData.max = maxAll;
      deb("init: min: %s, max: %s, metric: %s\n", tab(~~minAll, 4), tab(~~maxAll, 6), m);
    });

    // scale data to GUI
    each(metrics, function(m, metricData){
      for (p=1; p<maxPlayers; p++){
        for (d=0; d<DOTS; d++){
          metricData.points[p][m][d] = scale(metricData.points[p][m][d], 0, metricData.max, 0, HEIGHT);
        }
      }
    });



  }
  function togglePlayer(player){

    var sprite = $("chartPlayerDot" + player);
    
    players[player].visible = !players[player].visible;
    sprite.sprite = players[player].visible ? "chartDotP" + player : "chartDotP0";
    showMetric(curMetric);

  }

  function showTicks(){

    var metric = Object.keys(metrics)[curMetric];

    $("chartTickTextYMax").caption = ~~metrics[metric].max + (metric === "area" ? "%" : "");
    $("chartTickTextYHalf").caption = ~~(metrics[metric].max / 2) + (metric === "area" ? "%" : "");
    $("chartTickTextXMax").caption = minutes + " min";
    $("chartTickTextXHalf").caption = ~~(minutes / 2) + " min";

  }
  function showMetric(metric){

    var i, min, max, dot, data, newSize, m = Object.keys(metrics)[metric];

    curMetric = metric;

    // hightlight current metric
    each(metrics, name => $(menuCapName(name)).textcolor = "180 180 180");
    $(menuCapName(m)).textcolor = "255 255 255";

    each(players, function(p, player){

      // player dots
      if (~~p !== 0){$("chartPlayer" + p).hidden = !metrics[m].points[p];}

      // data dots
      if (~~p !== 0 && metrics[m].points[p]){

        data = metrics[m].points[p][m];
        min  = ~~Math.min.apply(Math, data);
        max  = ~~Math.max.apply(Math, data);

        deb("showMetric: %s, p: %s, vis: %s, len: %s, min: %s, max: %s\n", m, p, player.visible, data.length, min, max);

        for (i = 0; i < DOTS; i++){

          dot = $("chartDot" + p + "[" + i + "]");

          if (player.visible){

            newSize = new GUISize();
            newSize.left = i * 8 + LEFT;
            newSize.top = TOP + HEIGHT - data[i];
            newSize.right = newSize.left + 8;
            newSize.bottom = newSize.top - 8;
            dot.size = newSize;
            dot.hidden = false;

          } else {
            if (dot){dot.hidden = true;}

          }

        }

      }

    });

    showTicks();
  }  

  return {
    action: function(metric, player, data){

      deb("\n====> Charts.action: %s, %s, %s\n", metric, player, data);

      if (!metric && !player){init(data); showMetric(0); return;}
      if ( metric && !player){showMetric(metric -1); return;}
      if (!metric &&  player){togglePlayer(player); return;}

    }

  };


}());

