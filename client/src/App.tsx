import { MediaFilters } from '@bitmap-flow/shared/lib/api';
import * as React from 'react';
import { Board } from './Board';
import { Filters } from './Filters';
import { Header } from './Header';
import { Tags } from './Tags';

// tslint:disable-next-line:no-var-requires
const styles = require('./App.css');

export class App extends React.Component<{}, AppState> {
    public constructor(props: {}) {
        super(props);
        this.state = {
            filters: {},
            numResults: 0
        };
    }

    public render() {
        // return (
        //     <Tags
        //         onChange={console.log}
        //         options={['foo', 'bar', 'baz', 'an option with a lot of text that takes up a lot of space']}
        //     />
        // );
        return (
            <div className={styles.container}>
                <Header
                />
                <div className={styles.content}>
                    <Filters
                        change={(filters) => this.onFiltersChanged(filters)}
                        numResults={this.state.numResults}
                    />
                    <div className={styles.boardContainer}>
                        <Board
                            filters={this.state.filters}
                            onMediaCountChange={(count) => this.handleMediaCountChange(count)}
                        />
                    </div>
                </div>
            </div>
        );
    }

    private onFiltersChanged(filters: MediaFilters) {
        this.setState({
            filters: {
                // Don't include missing sources
                source: filters.source === '' ? undefined : filters.source,
                tags: filters.tags
            }
        });
    }

    private handleMediaCountChange(count: number) {
        this.setState({
            numResults: count
        });
    }
}

interface AppState {
    filters: MediaFilters;
    numResults: number;
}
