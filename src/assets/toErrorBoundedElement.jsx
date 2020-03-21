import * as React from 'react';
import { withErrorBoundary } from 'react-error-boundary';

const FallbackElement = ({ componentStack, error }) => (
    <div>
        <p><strong>Oops! An error occured!</strong></p>
        <p><strong>Error:</strong> {error.toString()}</p>
        <p><strong>Stacktrace:</strong> {componentStack}</p>
    </div>
);

/**
 * Converts a component type to one that has an error boundary
 * @param {React.ComponentType<any>} Component The component type to add an error boundary to
 */ 
export default function toErrorBoundedElement(Component) {
    return withErrorBoundary(
        Component,
        FallbackElement,
    );
}
