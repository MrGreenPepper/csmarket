import Tables from './components/Tables';
export default function BaseStatistics({ data }) {
	console.log(data);

	return (
		<div id="baseStatistics">
			<Tables data={data} />
		</div>
	);
}
