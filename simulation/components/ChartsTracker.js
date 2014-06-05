
// Updates every minute
const UPDATE_TIMER_INTERVAL = 60000, VERSION = "0.1.1";

function ChartsTracker() {}

ChartsTracker.prototype.Schema = "<a:component type='system'/><empty/>";

ChartsTracker.prototype.GetChartData = function()
{
  return this.chartData;
};
  
ChartsTracker.prototype.Init = function()
{
  var cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
  this.updateTimer = cmpTimer.SetInterval(this.entity, IID_ChartsTracker, "updateData", UPDATE_TIMER_INTERVAL, UPDATE_TIMER_INTERVAL, {});
  this.timeStamp = 0;
  this.chartData = {};
};

ChartsTracker.prototype.updateData = function()
{
  // Get player + range + stats manager
  var cmpPlayer = Engine.QueryInterface(this.entity, IID_Player);
  var cmpRangeManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
  var cmpStatisticsManager = Engine.QueryInterface(this.entity, IID_StatisticsTracker);
  var resourceCount = cmpPlayer.GetResourceCounts();
  var statistics = cmpStatisticsManager.GetStatistics();

  this.chartData[this.timeStamp++] =  {
    'area': cmpRangeManager.GetPercentMapExplored(cmpPlayer.GetPlayerID()),
    'food': resourceCount.food,
    'wood': resourceCount.wood,
    'stone': resourceCount.stone,
    'metal': resourceCount.metal,
    'units': cmpPlayer.GetPopulationCount(),
    'buildings': statistics.buildingsConstructed.total - statistics.buildingsLost.total
  };

};

Engine.RegisterComponentType(IID_ChartsTracker, "ChartsTracker", ChartsTracker);
