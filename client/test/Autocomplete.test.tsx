import { shallow, ShallowWrapper } from 'enzyme';
import { sortBy } from 'lodash';
import * as React from 'react';
import { Autocomplete, AutocompleteProps, AutocompleteState } from '../src/Autocomplete';

// I need to stop coding hungry
const OPTIONS = [
    'Peanut Butter',
    'Jelly',
    'Bread',
    'Cashews',
    'Eggs',
    
    // Intentionally lower-cased
    'peanuts',
    'peas',
    'bananas',
    'bacon',
    'jam'
];

const KEY_CODES = {
    up: 38,
    down: 40,
    enter: 13,
    escape: 27,
    backspace: 8
};

const OPTIONS_SORTED = sortBy(OPTIONS, (item) => item.toLowerCase());

describe('<Autocomplete />', () => {
    it('should provide minimalistic defaults', async () => {
        const { comp } = await init();

        expect(comp.props).toEqual({
            deleteAction: 'none',
            options: OPTIONS,
            highlightMatches: false,
            value: '',
            minWidth: 50
        });
    });

    it('should allow a promise to be passed for options instead of a string array', async () => {
        const { comp } = await init({
            options: Promise.resolve(OPTIONS)
        });

        expect(comp.state).toEqual({
            showOptions: false,
            currentlySelectingOption: false,
            optionIndex: -1,
            availableOptions: OPTIONS_SORTED,
            allOptions: OPTIONS,
            textWidth: 0,
            inputPadding: null
        });
    });

    it('should render options in alphabetical order (case insensitive)', async () => {
        const { comp } = await init();

        expect(comp.state.availableOptions).toEqual(OPTIONS_SORTED);
        
        // Simulate a focus event
        (comp as any).handleFocus();

        await tick();

        // Assume things get rendered since I'm lazy
        expect(comp.state.showOptions).toBe(true);
    });

    it('should show/hide the options when focused/blurred', async () => {
        const { comp } = await init({
            options: OPTIONS
        });

        (comp as any).handleFocus();
        await tick();
        expect(comp.state.showOptions).toBe(true);

        (comp as any).handleBlur();
        await tick();
        expect(comp.state.showOptions).toBe(false);
    });

    it('should filter the available options when text is entered', async () => {
        const { wrapper, comp } = await init();
        
        wrapper.setProps({ value: 'pea' });
        await tick();

        // Emphasize case-insensitive search
        expect(comp.state.availableOptions).toEqual(['Peanut Butter', 'peanuts', 'peas']);
    });

    it('should call the handler when the input value has changed', async () => {
        const spy = jest.fn();
        const { comp } = await init({
            options: OPTIONS,
            onValueChange: spy
        });

        // Simulate the user typing 'ab'
        (comp as any).handleChange('a', false);
        (comp as any).handleChange('ab', false);

        expect(spy.mock.calls).toEqual([['a'], ['ab']]);
    });

    it('should update case when the user types in an option', async () => {
        const valueSpy = jest.fn();
        const optionSpy = jest.fn();

        const { wrapper, comp } = await init({
            options: OPTIONS,
            onValueChange: valueSpy,
            onOptionPicked: optionSpy
        });

        const word = 'PEAS';
        for (let i = 1; i < word.length + 1; i++) {
            const segment = word.slice(0, i);

            // Generate suggestions for the upcoming input
            wrapper.setProps({ value: segment });
            // Wait for state to settle
            await tick();

            (comp as any).handleChange(segment);
        }

        // The last output should be when the component realizes that the input
        // is actually an option and updates its case to fit the option
        expect(valueSpy.mock.calls).toEqual([['P'], ['PE'], ['PEA'], ['peas']]);
        expect(optionSpy.mock.calls).toEqual([['peas']]);
    });

    it('should allow selection via the up/down arrows and the enter key', async () => {
        const spy = jest.fn();
        const { comp } = await init({
            // Only provide 2 options to more simply test pressing up/down at
            // extremes
            options: ['a', 'b'],
            onOptionPicked: spy
        });

        const sendKey = (code: number) => {
            (comp as any).handleKeyDown({ keyCode: code });
            return tick();
        };

        expect(comp.state.optionIndex).toBe(-1);

        const { up, down, enter } = KEY_CODES;

        // First is the key code to send, second is the expected index
        const expectations: number[][] = [
            // Should do nothing
            [ up, -1 ],
            [ down, 0 ],
            [ down, 1 ],
            // We've reached the end, this should do nothing
            [ down, 1 ],
            // Submitting should reset
            [ enter, -1 ]
        ];

        for (const expectation of expectations) {
            const [keyCode, expectedIndex] = expectation;

            await sendKey(keyCode);
            expect(comp.state.optionIndex).toBe(expectedIndex);
            expect(comp.state.showOptions).toBe(false);
        }
    });

    it('should highlight the first option when enter is pressed and nothing is highlighted', async () => {
        const { comp } = await init();

        expect(comp.state.optionIndex).toBe(-1);

        (comp as any).handleKeyDown({ keyCode: KEY_CODES.enter });
        await tick();

        expect(comp.state.optionIndex).toBe(0);
    });

    it('should request deletion when a callback is defined and deleteAction is "requestDeletion"', async () => {
        const spy = jest.fn();
        const { comp } = await init({
            options: OPTIONS,
            deleteAction: 'requestDeletion',
            onDeleteRequested: spy
        });

        (comp as any).handleKeyDown({
            keyCode: KEY_CODES.backspace,
            preventDefault: () => { /* do nothing */}
        });
        await tick();

        expect(spy).toHaveBeenCalled();
    });

    // TODO
    // it('should expand to fit the size of the input when "dynamicSize" is true')
});

/**
 * Resolves upon entering the next macro-task.
 */
function tick() {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
    });
}

async function init(props: Partial<AutocompleteProps> = { options: OPTIONS }): Promise<{
    wrapper: ShallowWrapper<AutocompleteProps, AutocompleteState, Autocomplete>,
    comp: Autocomplete
}> {
    const wrapper: ShallowWrapper<AutocompleteProps, AutocompleteState, Autocomplete> =
        shallow(<Autocomplete {...props as AutocompleteProps} />);

    // Stub out these two methods since they require a browser
    jest.spyOn(wrapper.instance(), 'getInputFont' as any)
        .mockImplementation(() => 'arial 12px');

    jest.spyOn(wrapper.instance(), 'measureTextWidth' as any)
        .mockImplementation(() => 0);

    // Wait until next tick to wait for Promise.resolve() microtask
    await tick();
    return { wrapper, comp: wrapper.instance() };
}
