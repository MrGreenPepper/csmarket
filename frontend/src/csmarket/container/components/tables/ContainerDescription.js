export default function ContainerDescription({ data }) {
	let containedItemData = data.itemdescription.items;
	let containerInfo = data.itemdescription.itemInfo;
	return (
		<div id="containerDescription">
			<table id="containerDescription_table">
				<thead>
					<tr>
						<td></td>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>containerInfo</td>
						<td>
							{containerInfo.map((entry) => {
								return <p>{entry}</p>;
							})}
						</td>
					</tr>

					<tr>
						<td>
							Container Nr.:
							<p />
						</td>
						<td>
							{data.itemdescription.containerSeries}
							<p />
						</td>
					</tr>
					{containedItemData.map((entry, index) => {
						return (
							<tr>
								<td>ItemNr: {index}</td>
								<td class="containerContents" rarity={entry.itemRarity}>
									{entry.itemName} | {entry.skinName}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
