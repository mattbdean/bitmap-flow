import * as React from 'react';

// tslint:disable-next-line:no-var-requires
const styles = require('./Header.css');

export class Header extends React.Component {
    public render() {
        return (<div className={styles.container}>
            <h1><a href='/'>bitmap flow</a></h1>
        </div>);
    }
}
