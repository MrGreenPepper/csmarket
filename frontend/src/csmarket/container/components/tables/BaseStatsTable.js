export default function BaseStats({ data }) {
	return (
		<div id="baseStats_table">
			<table>
				<thead>
					<tr>
						<td></td>
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
		</div>
	);
}
