import HistoricTable from './components/tables/HistoricTable.js';
import TradeVolumeChart from './components/charts/TradeVolumeChart.js';
import BarChart from './components/charts/BarChart.js';

export default function HistoricStats({ historicData }) {
	let xScale = historicData.tradeVolumes.sortByCount;
	let yScale = historicData.tradeVolumes.sortByPrice;
	let lineValues = historicData.tradeVolumes.sortByPrice;

	let data = { xScale: xScale, yScale: yScale, lineValues: lineValues };

	//let chart = TradeVolumeChart(xScale, yScale, lineValues);
	return (
		<div id="historicStats">
			<h3> historicStats</h3>
			<HistoricTable historicData={historicData} />
			<TradeVolumeChart data={data} />
			<div id="testChart"></div>
		</div>
	);
}
