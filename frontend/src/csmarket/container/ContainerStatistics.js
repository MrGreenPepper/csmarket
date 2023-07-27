import { useEffect } from 'react';
import tradeVolumeChart from './components/charts/TradeVolumeCharts';
import BaseStats from './BaseStatistcs.js';
import HistoricStats from './HistoricStats.js';
import OrderStats from './OrderStats.js';

export default function ContainerStatistcs({ data }) {
	let xScale = data.orderdata.map((entry) => entry.price);
	xScale = xScale.sort((a, b) => a - b);
	let yScale = data.orderdata.map((entry) => entry.count);
	yScale = yScale.sort((a, b) => a - b);

	let lineValues = data.orderdata.sort((a, b) => a.price - b.price);

	useEffect(() => tradeVolumeChart(xScale, yScale, lineValues, []));

	console.log(data);
	return (
		<div>
			<BaseStats data={data} />
			<HistoricStats historicData={data.statistics.historic} />
			<OrderStats data={data.statistics.order} />
			<div id="scatterPlot_tradeVolumes"></div>;
		</div>
	);
}
