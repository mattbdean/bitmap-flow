const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16')

module.exports = () => {
    Enzyme.configure({ adapter: new Adapter() });

    global.requestAnimationFrame = (cb) => {
        setTimeout(cb, 0);
    };
}