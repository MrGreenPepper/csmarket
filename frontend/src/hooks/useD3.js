import React from 'react';
import * as d3 from 'd3';

export const useD3 = (renderChartFn, data) => {
	const ref = React.useRef();
	let xScale = data.xScale;
	let yScale = data.yScale;
	let lineValues = data.lineValues;

	React.useEffect(() => {
		renderChartFn(d3.select(ref.current), xScale, yScale, lineValues);
		return () => {};
	}, [lineValues]);
	return ref;
};
