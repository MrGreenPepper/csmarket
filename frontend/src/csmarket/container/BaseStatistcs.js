import Tables from './components/Tables';
export default function BaseStatistics({ data }) {

	return (
		<div id="baseStatistics">
			<Tables data={data} />
		</div>
	);
}
