import BaseTable from './components/tables/BaseStatsTable.js';
import ContainerDescription from './components/tables/ContainerDescription.js';

export default function BaseStatistics({ data }) {
	return (
		<div id="baseStatistics">
			<h3>baseStats</h3>
			<ContainerDescription data={data} />
			<BaseTable data={data} />
		</div>
	);
}
