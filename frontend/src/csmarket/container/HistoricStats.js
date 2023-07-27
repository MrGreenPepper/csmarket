import HistoricTable from './components/tables/HistoricTable.js';
export default function HistoricStats({ historicData }) {
	return (
		<div id="historicStats">
			<h3> historicStats</h3>
			<HistoricTable historicData={historicData} />
		</div>
	);
}
