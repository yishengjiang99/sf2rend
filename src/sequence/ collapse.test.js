
import {render, fireEvent, screen} from '@testing-library/react';
import Collapsible from './collapse';

test('renders learn react link', () => {
	const {getByText} = render(<Collapsible title="summary">afadsfd</Collapsible>);
	const linkElement = screen.getByText(/summary/i);

	expect(linkElement).toBeInTheDocument();
	expect(screen.getByText("afadsfd")).not.toBeVisible();

	fireEvent.click(screen.getByText("summary"));
	expect(screen.getByText("afadsfd")).toBeInTheDocument();
});
