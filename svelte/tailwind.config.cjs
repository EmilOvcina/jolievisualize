module.exports = {
	darkmode: true,
	content: ['./out/index.html', './src/**/*.{svelte,js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				service: '#e9a727',
				serviceHighlight: '#f0c168', // %30
				serviceStroke: '#5d4310', //%60
				inputPort: '#e5dc60',
				ipStroke: '#5c5826',
				outputPort: '#db0000',
				opStroke: '#580000',
				black: '#000',
				white: '#fff',
				bg: '#353535'
			}
		}
	},
	plugins: []
};
