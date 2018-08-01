import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { App } from './App';

import '../polyfills';

// tslint:disable-next-line:no-var-requires
require('./index.css');

ReactDOM.render(
    <App />,
    document.getElementById('root')
); 
