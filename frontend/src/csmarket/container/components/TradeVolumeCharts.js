export default function TradeVolumeChart() {
	const margin = { top: 10, right: 30, bottom: 30, left: 60 },
		width = 460 - margin.left - margin.right,
		height = 400 - margin.top - margin.bottom;

	// append the svg object to the body of the page
	const svg = window.d3
		.select('div#scatterPlot_tradeVolumnes')
		.append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', `translate(${margin.left},${margin.top})`);

	//Read the data
	window.d3
		.csv(
			'https://raw.githubusercontent.com/holtzy/d3-graph-gallery/master/DATA/connectedscatter.csv',
			// When reading the csv, I must format variables:
			function (d) {
				return { date: window.d3.timeParse('%Y-%m-%d')(d.date), value: d.value };
			}
		)
		.then(
			// Now I can use this dataset:
			function (data) {
				// Add X axis --> it is a date format
				const x = window.d3
					.scaleTime()
					.domain(window.d3.extent(data, (d) => d.date))
					.range([0, width]);
				svg.append('g')
					.attr('transform', 'translate(0,' + height + ')')
					.call(window.d3.axisBottom(x));
				// Add Y axis
				const y = window.d3.scaleLinear().domain([8000, 9200]).range([height, 0]);
				svg.append('g').call(window.d3.axisLeft(y));
				// Add the line
				svg.append('path')
					.datum(data)
					.attr('fill', 'none')
					.attr('stroke', '#69b3a2')
					.attr('stroke-width', 1.5)
					.attr(
						'd',
						window.d3
							.line()
							.x((d) => x(d.date))
							.y((d) => y(d.value))
					);
				// Add the points
				svg.append('g')
					.selectAll('dot')
					.data(data)
					.join('circle')
					.attr('cx', (d) => x(d.date))
					.attr('cy', (d) => y(d.value))
					.attr('r', 5)
					.attr('fill', '#69b3a2');
			}
		);
}
