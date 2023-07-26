export default function Tables({ data }) {
	return (
		<div id="baseStats_table">
			<table>
				<thead>
					<tr>
						<td>baseStats</td>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>itemName</td>
						<td>{data.itemname}</td>
					</tr>
					<tr>
						<td>lifetime</td>
						<td>
							Years: {data.lifetime.years} Days: {data.lifetime.days}
						</td>
					</tr>
					<tr>
						<td>dropable</td>
						<td></td>
					</tr>
				</tbody>
			</table>
			<table>
				<thead>
					<tr>
						<td>tradeVolumne</td>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>orderSum</td>
						<td>{data.tradevolumes.orderSum}</td>
					</tr>
					<tr>
						<td>historicSum</td>
						<td>{data.tradevolumes.historicSum}</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
