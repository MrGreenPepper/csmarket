import { useEffect } from 'react';
import BaseStatistics from './BaseStatistcs';
import tradeVolumeChart from './components/TradeVolumeCharts';

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
			<BaseStatistics data={data} />
			<div id="scatterPlot_tradeVolumnes"></div>;
		</div>
	);
}
