import BaseStatistics from './BaseStatistcs';
import TradeVolumeChart from './components/TradeVolumeCharts';

export default function ContainerStatistcs({ data }) {
	let xScale = data.orderdata.map((entry) => entry.price);
	xScale = xScale.sort((a, b) => a - b);
	let yScale = data.orderdata.map((entry) => entry.count);
	yScale = yScale.sort((a, b) => a - b);

	let lineValues = data.orderdata.sort((a, b) => a.price - b.price);

	console.log('data', data);
	return (
		<div>
			<BaseStatistics data={data} />
			<TradeVolumeChart xScale={xScale} yScale={yScale} lineValues={lineValues} />
		</div>
	);
}
