import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';

describe('Tabs components', () => {
  test('applies default styling and custom classes', () => {
    render(
      <Tabs defaultValue="overview" className="custom-tabs">
        <TabsList className="custom-list">
          <TabsTrigger value="overview" className="trigger-one">
            Overview
          </TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="custom-content" forceMount>
          Overview Content
        </TabsContent>
        <TabsContent value="stats" forceMount>
          Stats Content
        </TabsContent>
      </Tabs>
    );

    const root = document.querySelector('[data-slot="tabs"]');
    expect(root).not.toBeNull();
    expect(root.className).toContain('custom-tabs');

    const tablist = screen.getByRole('tablist');
    expect(tablist.className).toContain('custom-list');

    const overviewTrigger = screen.getByRole('tab', { name: 'Overview' });
    expect(overviewTrigger.className).toContain('trigger-one');
    expect(overviewTrigger.className).toContain('rounded-xl');

    const overviewContent = screen.getByText('Overview Content');
    expect(overviewContent).toHaveAttribute('data-slot', 'tabs-content');
    expect(overviewContent.className).toContain('custom-content');
  });

  test('switches active content when tab trigger is clicked', async () => {
    const user = userEvent.setup();

    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" forceMount>
          Overview Content
        </TabsContent>
        <TabsContent value="stats" forceMount>
          Stats Content
        </TabsContent>
      </Tabs>
    );

    const statsContent = screen.getByText('Stats Content');
    expect(statsContent).toHaveAttribute('data-state', 'inactive');

    const statsTrigger = screen.getByRole('tab', { name: 'Stats' });
    await user.click(statsTrigger);

    expect(statsContent).toHaveAttribute('data-state', 'active');
    const overviewContent = screen.getByText('Overview Content');
    expect(overviewContent).toHaveAttribute('data-state', 'inactive');
  });
});
