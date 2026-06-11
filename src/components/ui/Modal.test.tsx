import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';
import { Input } from './Input';

function TypingModalFixture() {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState('');

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open</button>
      <Modal open={open} onClose={() => setOpen(false)} title="New book">
        <Input
          aria-label="Book title"
          value={value}
          onChange={e => setValue(e.target.value)}
        />
      </Modal>
    </>
  );
}

describe('Modal', () => {
  test('keeps focus on input while typing multiple characters', async () => {
    render(<TypingModalFixture />);

    const input = screen.getByRole('textbox', { name: /book title/i });
    input.focus();
    fireEvent.change(input, { target: { value: 'My Book Title' } });

    expect(input).toHaveValue('My Book Title');
    expect(input).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Close' })).not.toHaveFocus();
  });

  test('typing character by character keeps input focused', async () => {
    render(<TypingModalFixture />);

    const input = screen.getByRole('textbox', { name: /book title/i });
    await userEvent.click(input);
    await userEvent.type(input, 'ABC');

    expect(input).toHaveValue('ABC');
    expect(input).toHaveFocus();
  });

  test('closes on Escape', async () => {
    const onClose = jest.fn();

    render(
      <Modal open onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  test('renders title and close button', () => {
    render(
      <Modal open onClose={jest.fn()} title="Dialog title">
        <p>Body</p>
      </Modal>
    );

    expect(screen.getByRole('heading', { name: 'Dialog title' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});
