import React from 'react';
import { fireEvent, wait } from '@testing-library/react';
import { dockerConfigs } from 'utils/constants';
import { renderWithProviders, testManagedImages } from 'utils/tests';
import ManagedImageModal from './ManagedImageModal';

describe('ManagedImageModal Component', () => {
  const onClose = jest.fn();

  const renderComponent = () => {
    const nodeImages = {
      managed: testManagedImages,
    };
    const initialState = {
      app: {
        settings: {
          nodeImages,
        },
      },
    };

    const image = nodeImages.managed[2];
    const result = renderWithProviders(
      <ManagedImageModal image={image} onClose={onClose} />,
      { initialState },
    );
    return {
      ...result,
      image,
    };
  };

  it('should display title', () => {
    const { getByText } = renderComponent();
    expect(getByText(/Customize Managed Node - */)).toBeInTheDocument();
  });

  it('should display form fields', () => {
    const { getByText } = renderComponent();
    expect(getByText('Docker Image')).toBeInTheDocument();
    expect(getByText('Command')).toBeInTheDocument();
  });

  it('should display footer buttons', () => {
    const { getByText } = renderComponent();
    expect(getByText('Reset to Default')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
    expect(getByText('Save')).toBeInTheDocument();
  });

  it('should display the command variables', () => {
    const { getByText, image } = renderComponent();
    expect(getByText('Command Variable Substitutions')).toBeInTheDocument();
    fireEvent.click(getByText('Command Variable Substitutions'));
    const vars = dockerConfigs[image.implementation].variables;
    vars.forEach(v => {
      expect(getByText(v)).toBeInTheDocument();
    });
  });

  it('should have form fields populated', () => {
    const { getByDisplayValue, image } = renderComponent();
    const { implementation, version } = image;
    const { imageName } = dockerConfigs[implementation];
    expect(getByDisplayValue(`${imageName}:${version}`)).toBeInTheDocument();
    expect(getByDisplayValue(image.command)).toBeInTheDocument();
  });

  it('should save the managed image', async () => {
    const { getByText, getByLabelText, store } = renderComponent();
    fireEvent.change(getByLabelText('Command'), { target: { value: 'a' } });
    fireEvent.click(getByText('Save'));
    await wait(() => {
      expect(store.getState().app.settings.nodeImages.managed[2].command).toBe('a');
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('should reset the managed image to default', async () => {
    const { getByText, store } = renderComponent();
    fireEvent.click(getByText('Reset to Default'));
    await wait(() => {
      expect(store.getState().app.settings.nodeImages.managed[2]).toBeUndefined();
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('should display an error notification if saving fails', async () => {
    onClose.mockImplementation(() => {
      throw new Error('test-error');
    });
    const { getByText, findByText } = renderComponent();
    fireEvent.click(getByText('Save'));
    expect(await findByText('Failed to update the Node Image')).toBeInTheDocument();
    expect(await findByText('test-error')).toBeInTheDocument();
  });
});