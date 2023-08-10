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
						<td>{historicData.tradeVolumes.tradeVolumeSum.toFixed(2)}</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
