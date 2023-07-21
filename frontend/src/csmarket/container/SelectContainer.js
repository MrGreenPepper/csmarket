import { useEffect, useState } from 'react';
import Select from 'react-select';
import axios from 'axios';
import ContainerStatistics from './ContainerStatistics.js';

const listUrl = '/api/csmarket/container/list';

export default function SelectContainer() {
	const [selectOptions, setSelectOptions] = useState();
	const [containerData, setContainerData] = useState();
	useEffect(() => {
		const getData = async () => {
			await axios.get(listUrl).then((res) => {
				console.log(res);
				setSelectOptions(res.data);
			});
		};
		getData();
	}, []);

	async function loadData(selectedOption) {
		let itemName = selectedOption.value;
		let apiURL = '/api/csmarket/container/statistics';
		await axios.get(apiURL, { params: { itemName: itemName } }).then((res) => {
			let data = res.data[0];
			setContainerData(data);
		});
		return;
	}
	return (
		<div>
			<h6>SelectContainer</h6>
			<Select options={selectOptions} onChange={(value) => loadData(value)}></Select>
			{containerData ? <ContainerStatistics data={containerData} /> : 'select one'}
		</div>
	);
}
