import Header from './Header.js';
import MainWindow from './MainWindow';
import Footer from './Footer.js';

export default function CSMarket() {
	return (
		<div className="mainFrame">
			<Header></Header>
			<MainWindow></MainWindow>
			<Footer></Footer>
		</div>
	);
}
