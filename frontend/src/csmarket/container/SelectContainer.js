import Select from 'react-select';
import axios from 'axios';
import { QueryClient, QueryClientProvider } from 'react-query';

let selectOptions = [
	{ value: 'v1', label: 'l1' },
	{ value: 'v2', label: 'l2' },
	{ value: 'v3', label: 'l3' },
];

fetchSelectorDat(){
	const {data} = await axios.get('localhost:3001/csmarket/')
}

export default function SelectContainer() {
	return (
		<div>
			SelectContainer
			<Select options={selectOptions}></Select>
		</div>
	);
}
