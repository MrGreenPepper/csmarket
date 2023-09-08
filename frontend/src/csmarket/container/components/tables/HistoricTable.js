import * as numberTools from '../../../../tools/numbers.js';

export default function HistoricTable({ historicData }) {
	return (
		<div id="historicTable">
			<table>
				<tbody>
					<tr>
						<td>traded count</td>
						<td>{historicData.countSum}</td>
					</tr>
					<tr>
						<td>traded volume sum</td>
						<td>{numberTools.numberToCurrency(historicData.tradeVolumes.tradeVolumeSum)} €</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
