import * as React from 'react';
import { MediaFilters } from '../../shared/src/api/media-filters';
import { Autocomplete } from './Autocomplete';
import { MediaApi } from './media-api';
import { Tags } from './Tags';

// tslint:disable-next-line:no-var-requires
const styles = require('./Filters.css');

export class Filters extends React.Component<FiltersProps, FiltersState> {
    private api: MediaApi;

    public constructor(props: FiltersProps) {
        super(props);

        this.api = new MediaApi();
        this.state = {
            source: '',
            sourceRaw: '',
            tags: [],
            allTags: this.api.tags(),
            allSources: this.api.sources()
        };
    }

    public render() {
        const results = this.props.numResults === undefined ? null : (
            <span className={styles.resultCount}>{this.props.numResults} results</span>
        );
        return (
            <div className={styles.container}>
                <div className={styles.filterContainer}>
                    <span className={styles.header}>Source</span>
                    <div className={styles.filter}>
                        <Autocomplete
                            options={this.state.allSources}
                            onValueChange={(val) => this.setState({ sourceRaw: val })}
                            value={this.state.sourceRaw}
                            onOptionPicked={(val) => this.onSourceChange(val)}
                            placeholder='Source'
                            deleteAction='clear'
                            minWidth={200}
                        />
                    </div>
                </div>

                <div className={styles.filterContainer}>
                    <span className={styles.header}>Tags</span>
                    <div className={styles.filter}>
                        <Tags
                            options={this.state.allTags}
                            onChange={(tags) => this.onTagsChange(tags)}
                        />
                    </div>
                </div>

                <div className={styles.spacer}></div>

                { results }
            </div>
        );
    }

    private onSourceChange(source: string) {
        if (this.state.source !== source)
            this.setState({ source }, () => this.emitChange());
    }

    private onTagsChange(tags: string[]) {
        console.log(tags);
        this.setState({ tags }, () => this.emitChange());
    }

    private emitChange() {
        if (this.props.change)
            this.props.change({
                source: this.state.source,
                tags: this.state.tags
            });
    }
}

interface FiltersProps {
    change?: (filters: MediaFilters) => void;

    /** If defined, the number of results will be shown */
    numResults?: number;
}

interface FiltersState {
    allTags: Promise<string[]>;
    allSources: Promise<string[]>;

    source: string;
    sourceRaw: string;
    tags: string[];
}
