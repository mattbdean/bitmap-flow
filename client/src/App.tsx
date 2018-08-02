import * as React from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import { Browse } from './browse/Browse';
import { Header } from './Header';
import { Upload } from './upload/Upload';

// tslint:disable-next-line:no-var-requires
const styles = require('./App.css');

export class App extends React.Component {
    public render() {
        return (
            <BrowserRouter>
                <div className={styles.container}>
                    <Header />
                    <Route path='/upload' component={Upload} />
                    <Route path='/' component={Browse} exact />
                </div>
            </BrowserRouter>
        );
    }
}
