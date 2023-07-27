import BaseTable from './components/tables/BaseStatsTable.js';

export default function BaseStatistics({ data }) {
	return (
		<div id="baseStatistics">
			<h3>baseStats</h3>
			<BaseTable data={data} />
		</div>
	);
}
