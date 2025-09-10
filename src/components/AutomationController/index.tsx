import React, { useState } from 'react';
import PodoLogo from "../PodoLogo";
import { AutomationDeletionButton } from "./AutiomationDeletionButton";

export const AutomationController: React.FC = () => {
    const [isAutomationRunning, setIsAutomationRunning] = useState(true);

    const handleDeleteAutomation = () => {
        setIsAutomationRunning(false);
        // Add automation deletion logic here
    };

    return (
        <div className="flex items-center">
            {isAutomationRunning ? (
                <AutomationDeletionButton
                    size="md"
                    onClick={handleDeleteAutomation}
                />
            ) : (
                <PodoLogo size="md" />
            )}
        </div>
    )
}

export default AutomationController;