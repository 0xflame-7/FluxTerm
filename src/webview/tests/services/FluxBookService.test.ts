import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fluxBookService } from '../../services/FluxBookService';
import { WebviewMessage, FluxBookDocument, ResolvedShell } from '../../../types/MessageProtocol';

describe('FluxBookService Messaging Bridge', () => {
    let mockPostMessage: any;

    beforeEach(() => {
        vi.clearAllMocks();
        // Access private vscode instance for verification since we mocked it in setup.ts
        mockPostMessage = (fluxBookService as any).vscode.postMessage;
    });

    it('should send init message', () => {
        fluxBookService.init();
        expect(mockPostMessage).toHaveBeenCalledWith({ type: 'init' });
    });

    it('should send execute message with correct params', () => {
        const mockShell: ResolvedShell = { id: 'sh', label: 'sh', path: '/bin/sh', args: [] };
        fluxBookService.execute('block-123', 'ls', mockShell, '/home');
        
        expect(mockPostMessage).toHaveBeenCalledWith({
            type: 'execute',
            blockId: 'block-123',
            command: 'ls',
            shell: mockShell,
            cwd: '/home'
        });
    });

    it('should send input message', () => {
        fluxBookService.sendInput('block-123', 'y\n');
        expect(mockPostMessage).toHaveBeenCalledWith({
            type: 'input',
            blockId: 'block-123',
            text: 'y\n'
        });
    });

    it('should send markDirty message', () => {
        fluxBookService.markDirty();
        expect(mockPostMessage).toHaveBeenCalledWith({ type: 'markDirty' });
    });

    it('should notify listeners on window message events', () => {
        const listener = vi.fn();
        const unsubscribe = fluxBookService.subscribe(listener);

        const testMsg = { type: 'test', data: 'hello' };
        window.dispatchEvent(new MessageEvent('message', { data: testMsg }));

        expect(listener).toHaveBeenCalledWith(testMsg);
        
        unsubscribe();
        window.dispatchEvent(new MessageEvent('message', { data: testMsg }));
        expect(listener).toHaveBeenCalledTimes(1);
    });
});
