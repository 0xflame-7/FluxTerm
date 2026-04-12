import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OutputArea } from '../../components/block/OutputArea';
import { FluxTermBlock, ResolvedShell } from '../../../types/MessageProtocol';

const mockShell: ResolvedShell = { id: 'sh', label: 'sh', path: '/bin/sh', args: [] };

const createMockBlock = (output: any[] = [], status: any = 'done'): FluxTermBlock => ({
    id: 'block-1',
    seq: 1,
    command: 'ls',
    shell: mockShell,
    cwd: '/home',
    branch: 'main',
    status,
    output,
    exitCode: null,
    finalCwd: null,
    finalBranch: null,
    createdAt: Date.now(),
    clearedAt: null,
    clearedAtTime: null,
});

describe('OutputArea Component', () => {
    it('should show loading state when running and no output', () => {
        const block = createMockBlock([], 'running');
        render(<OutputArea block={block} searchQuery="" />);
        expect(screen.getByText('Waiting for output…')).toBeInTheDocument();
    });

    it('should show "no output" when done and empty', () => {
        const block = createMockBlock([], 'done');
        render(<OutputArea block={block} searchQuery="" />);
        expect(screen.getByText('(no output)')).toBeInTheDocument();
    });

    it('should render stdout and stderr lines', () => {
        const block = createMockBlock([
            { text: 'hello world', type: 'stdout' },
            { text: 'error occurred', type: 'stderr' }
        ]);
        render(<OutputArea block={block} searchQuery="" />);
        expect(screen.getByText('hello world')).toBeInTheDocument();
        expect(screen.getByText('error occurred')).toBeInTheDocument();
    });

    it('should merge stdin lines onto preceding lines', () => {
        const block = createMockBlock([
            { text: 'Name:', type: 'stdout' },
            { text: 'John', type: 'stdin' }
        ]);
        render(<OutputArea block={block} searchQuery="" />);
        
        // buildDisplayRows merges stdin onto stdout
        expect(screen.getByText('Name:')).toBeInTheDocument();
        expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('should highlight search results', () => {
        const block = createMockBlock([
            { text: 'find me', type: 'stdout' },
            { text: 'not here', type: 'stdout' }
        ]);
        render(<OutputArea block={block} searchQuery="find" />);

        // The highlighted item's text is rendered inside an Ansi span; walk up
        // to find the styled container div that carries the backgroundColor.
        const textEl = screen.getByText('find me');
        // Traverse up looking for a div with a non-empty backgroundColor style
        let el: HTMLElement | null = textEl;
        let found = false;
        while (el) {
            if (el.style?.backgroundColor) {
                found = true;
                break;
            }
            el = el.parentElement;
        }
        expect(found).toBe(true);
    });
});
