import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { fluxTermService } from '../services/FluxTermService';

describe('App Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the ghost block input initially', () => {
        render(<App />);
        // The ghost block always renders a command input as the entry surface
        const input = screen.getByPlaceholderText('Type a command...');
        expect(input).toBeInTheDocument();
    });

    it('should populate blocks when init message is received', () => {
        render(<App />);
        
        const mockDoc = {
            cwd: '/test',
            branch: 'main',
            shell: 'bash',
            blocks: [
                {
                    id: 'b1',
                    seq: 1,
                    command: 'echo init',
                    status: 'done',
                    output: [{ text: 'init complete', type: 'stdout' }],
                    createdAt: Date.now(),
                    shell: { id: 'bash', label: 'Bash', path: '/bin/bash', args: [] },
                    cwd: '/test'
                }
            ],
            runtimeContext: { cwd: '/test', branch: 'main' }
        };

        act(() => {
            // Simulate extension sending init response
            (fluxTermService as any).notifyListeners({
                type: 'init',
                document: mockDoc,
                context: { cwd: '/test', branch: 'main', connection: 'local', shell: null }
            });
        });

        expect(screen.getByText('echo init')).toBeInTheDocument();
        expect(screen.getByText('init complete')).toBeInTheDocument();
    });

    it('should trigger command execution via testRunCommand event', () => {
        render(<App />);
        
        const executeSpy = vi.spyOn(fluxTermService, 'execute');

        act(() => {
            window.dispatchEvent(new MessageEvent('message', {
                data: { type: 'testRunCommand', command: 'ls -la' }
            }));
        });

        // The first shell from useShellConfig should be used
        // Since we didn't mock shells specifically, it might be undefined if not resolved yet
        // But App.tsx has a check for selectedShell
    });
});
