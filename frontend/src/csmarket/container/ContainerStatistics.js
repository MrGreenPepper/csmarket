import BaseStatistics from './BaseStatistcs';

export default function ContainerStatistcs({ data }) {
	console.log('data', data);
	return (
		<div>
			{' '}
			some data
			<BaseStatistics data={data} />
		</div>
	);
}
