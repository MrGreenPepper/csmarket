export default function TradeVolumeChart({ xScale, yScale, lineValues }) {
	let d3 = window.d3;
	const margin = { top: 10, right: 30, bottom: 30, left: 60 },
		width = 460 - margin.left - margin.right,
		height = 400 - margin.top - margin.bottom;

	//remove old ones
	d3.select('div#scatterPlot_tradeVolumnes svg').remove();
	// Create the SVG container.
	const svg = d3
		.select('div#scatterPlot_tradeVolumnes')
		.append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g');
	// create X axis
	const x = d3
		.scaleLinear()
		.domain([xScale[0], xScale[xScale.length - 1]])
		.range([margin.left, width - margin.left]);
	//append x axis
	svg.append('g').attr('transform', `translate(${margin.left} ${height})`).call(d3.axisBottom(x));

	const y = d3
		.scaleLinear()
		.domain([yScale[0], yScale[yScale.length - 1]])
		.range([height - margin.bottom, margin.top]);
	//append y axis
	svg.append('g').attr('transform', `translate(${margin.left} ${margin.top})`).call(d3.axisLeft(y));

	//line
	const line = d3
		.line()
		.y((d) => y(d.count))
		.x((d) => x(d.price));

	// Append a path for the line.
	svg.append('path')
		.attr('fill', 'none')
		.attr('stroke', 'steelblue')
		.attr('stroke-width', 1.5)
		.attr('transform', `translate(${margin.left} ${margin.top})`)
		.attr('d', line(lineValues));

	return <div id="scatterPlot_tradeVolumnes"></div>;
}
