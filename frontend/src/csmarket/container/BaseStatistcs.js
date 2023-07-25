import TradeVolumeChart from './components/TradeVolumeCharts';

import Tables from './components/Tables';
export default function BaseStatistics({ data }) {
	console.log(data);

	TradeVolumeChart();

	return (
		<div id="baseStatistics">
			<Tables data={data} />

			<div id="scatterPlot_tradeVolumnes"></div>
		</div>
	);
}
