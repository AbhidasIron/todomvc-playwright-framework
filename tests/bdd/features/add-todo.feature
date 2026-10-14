@regression
Feature: Add todos
  As a busy person
  I want to capture tasks quickly
  So that I don't forget them

  Background:
    Given I am on the TodoMVC app

  @smoke
  Scenario: Add a single todo
    When I add a todo "Buy milk"
    Then I should see the todos:
      | Buy milk |
    And the counter should show "1 item left"

  Scenario: Add several todos at once
    When I add the todos:
      | Buy milk       |
      | Walk the dog   |
      | Read a chapter |
    Then I should see the todos:
      | Buy milk       |
      | Walk the dog   |
      | Read a chapter |
    And the counter should show "3 items left"

  Scenario Outline: Blank input is ignored
    When I submit a todo made of <spaces> spaces
    Then I should see 0 todos

    Examples:
      | spaces |
      | 0      |
      | 1      |
      | 10     |

  Scenario: Input is trimmed
    When I add a todo "   Trim me   "
    Then I should see the todos:
      | Trim me |
